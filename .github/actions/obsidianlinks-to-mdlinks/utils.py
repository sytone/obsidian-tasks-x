import os
import re


def getAllDocumentPaths(source_directory):
    allpaths = list()

    for (dirpath, dirnames, filenames) in os.walk(source_directory):
        dirnames.sort()
        filenames.sort()
        for filename in filenames:
            path = os.path.join(dirpath, filename)
            # path.replace(source_directory, "")
            allpaths.append(path)
    allpaths.sort(reverse=True)

    return allpaths


def getFileFullText(path):
    with open(path) as f:
        fulltext = f.read()

    return re.sub(r"%%.*%%", "", fulltext)


def replaceLinks(text, allpaths, docsdirectory):
    foundmatches = re.findall(
        r'(?P<fullwikilink>\[\[(?P<linkpage>.*?)\]\]?)', text)
    outputtext = text
    for item in foundmatches:
        fullwikilink = item[0]
        linkpagesrc = item[1]
        linkpagename = re.sub(r'\|.*$', '', linkpagesrc)
        linkpage = re.sub(r'^.*\|', '',  linkpagesrc) + ".md"

        pageurl = ''
        for path in allpaths:
            filename = path.split("/")[-1]
            # print('linkpagename:', linkpagename)
            # print("filename:", filename)

            if linkpagename + ".md" == filename:
                pageurl = path

        if len(pageurl) > 0:

            # print(pageurl)
            replacetext = "[" + linkpage.replace(".md", "") + \
                "]("+pageurl.replace(docsdirectory,
                                     "/knowledge/").replace(':', ' -').replace(".md", "") + ")"
        else:
            replacetext = "**"+linkpagename+"**"
        outputtext = outputtext.replace(
            fullwikilink, replacetext)
    return outputtext


def replaceMermaidBlocks(text):
    regex = r"(```mermaid(?P<mermaid>[\s\S]*?)```)"
    subst = "<script src='https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'></script><div class=mermaid>\\g<mermaid></div>"
    result = re.sub(regex, subst, text, 0, re.MULTILINE)
    return result


def replaceurl(path, allpaths, docsdirectory):
    fulltext = getFileFullText(path)
    replacedtext = replaceLinks(fulltext, allpaths, docsdirectory)
    replacedtext = replaceMermaidBlocks(replacedtext)
    print(replacedtext)
    os.remove(path)
    with open(path.replace(':', ' -'), "w") as f:
        f.write(replacedtext)
