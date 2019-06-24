
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
        

def deploy_files(deploy_dir_name, module_dir_name):
    for file_path in get_files(module_dir_name):
        # Extract directory information from the file's path
        path_directories = file_path.split("/")[1:-1]
        directory_path = os.path.join(deploy_dir_name, "/".join(path_directories))

        if len(path_directories) > 0 and not os.path.exists(directory_path):
            # Ensure that the correct directory exists
            confirmed_path = deploy_dir_name
            for dir_name in path_directories:
                confirmed_path = os.path.join(confirmed_path, dir_name)
                if not os.path.exists(confirmed_path):
                    print("Create the " + confirmed_path + " directory...")
                    os.mkdir(confirmed_path)
        else:
            # Copy the file
            print("Copying " + file_path + " to " + directory_path)
            shutil.copy(file_path, directory_path)

if __name__ == "__main__":
    if not os.path.exists("deploy"):
        os.mkdir("deploy")
    
    deploy_files("deploy", "node_modules")
    deploy_files("deploy", "src")
    
