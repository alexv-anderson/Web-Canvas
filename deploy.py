
import json
import shutil
import os

def get_files(directory_path):
    ignore = [ "package.json", "tsconfig.json" ]
    files = []

    for file_name in os.listdir(directory_path):
        file_path = os.path.join(directory_path, file_name)
        if os.path.isdir(file_path):
            files += get_files(file_path)
            continue

        if not file_name in ignore:
            files.append(file_path)

    return files
        

def deploy_files(deploy_dir_path, module_dir_path, module_meta):
    for file_path in get_files(module_dir_path):
        # Extract directory information from the file's path
        path_directories = file_path.replace(module_dir_path, "").split("/")[1:-1]
        directory_path = os.path.join(deploy_dir_path, "/".join(path_directories))

        depth = len(path_directories)

        if depth > 0 and not os.path.exists(directory_path):
            # Ensure that the correct directory exists
            confirmed_path = deploy_dir_path
            for dir_name in path_directories:
                confirmed_path = os.path.join(confirmed_path, dir_name)
                if not os.path.exists(confirmed_path):
                    os.mkdir(confirmed_path)
    
        # Copy the file
        write_file_with_meta(file_path, directory_path, depth, module_meta)


def load_module_meta_from(module_dir_path):
    modules = []
    for dir_name in os.listdir(module_dir_path):
        package_file_path = os.path.join(module_dir_path, dir_name, "package.json")
        if os.path.exists(package_file_path):
            with open(package_file_path, 'r') as f:
                package_dict = json.load(f)
                if "name" not in package_dict:
                    print('No "name" for ' + package_file_path)
                    continue
                if "main" not in package_dict:
                    print('No "main" for ' + package_file_path)
                    continue

                print(dir_name + " -> " + package_dict["main"])

                if package_dict["main"].startswith("."):
                    main = package_dict["main"].replace(".", dir_name, 1)
                else:
                    main = os.path.join(dir_name, package_dict["main"])

                modules.append({
                    "name": package_dict["name"],
                    "main": main
                })

    return modules


def write_file_with_meta(file_path, destination_directory, depth, module_meta):
    dots = "/".join(map(lambda i: "..", range(depth)))
    filename = file_path.split("/")[-1]
    with open(file_path, "r") as src_file, open(os.path.join(destination_directory, filename), "w+") as dest_file:
        # Write lines into the file
        for line in src_file:
            if "import" in line and "from" in line:
                # This is an import line, replace module names with its path
                for meta in module_meta:
                    line = line.replace(meta["name"], os.path.join(dots, meta["main"]))
                    continue
            
            dest_file.write(line)
    

if __name__ == "__main__":
    deploy_dir_path = "./deploy"
    module_dir_path = "./node_modules"
    source_dir_path = "./src"

    if os.path.exists(deploy_dir_path):
        os.system("rm -r " + deploy_dir_path)
    os.mkdir(deploy_dir_path)
    
    module_meta = load_module_meta_from(module_dir_path)

    print(module_meta)

    deploy_files(deploy_dir_path, module_dir_path, module_meta)
    deploy_files(deploy_dir_path, source_dir_path, module_meta)
    
