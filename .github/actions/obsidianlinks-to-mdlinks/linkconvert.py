import os

from utils import getAllDocumentPaths, replaceurl

docsdirectory = os.environ["INPUT_SRCROOTDIRECTORY"]
allpaths = getAllDocumentPaths(docsdirectory)

for path in allpaths:
    fullpath = path.split("/")
    filename = fullpath[-1]

    if path.endswith(".md"):
      replaceurl(path, allpaths, docsdirectory)
