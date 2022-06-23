import os

from utils import get_all_document_paths, replace_url

docs_directory = os.environ["INPUT_SRCROOTDIRECTORY"]
print(f"SRCROOTDIRECTORY: {docs_directory}")
all_paths = get_all_document_paths(docs_directory)

for path in all_paths:
    full_path = path.split("/")
    filename = full_path[-1]

    if path.endswith(".md"):
        replace_url(path, all_paths, docs_directory)
