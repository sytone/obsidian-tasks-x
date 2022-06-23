import os
import re


def get_all_document_paths(source_directory):
    all_paths = list()

    for (dirpath, dirnames, filenames) in os.walk(source_directory):
        dirnames.sort()
        filenames.sort()

        for filename in filenames:
            path = os.path.join(dirpath, filename)
            if "_site" not in dirpath:
                all_paths.append(path)

    all_paths.sort(reverse=True)

    return all_paths


def get_file_full_text(path):
    print(f"get_file_full_text path is {path}")
    with open(path) as f:
        full_text = f.read()

    return re.sub(r"%%.*%%", "", full_text)


def replace_links(text, all_paths, docs_directory, url_base):
    found_matches = re.findall(r"(?P<full_wiki_link>\[\[(?P<link_page>.*?)\]\]?)", text)
    output_text = text

    for item in found_matches:
        full_wiki_link = item[0]
        link_page_src = item[1]
        link_page_name = re.sub(r"\|.*$", "", link_page_src)
        link_page_description = re.sub(r"^.*\|", "", link_page_src)

        print(f"       Original Link: {full_wiki_link}")
        print(f"           Page link: {link_page_name}")
        print(f"Optional description: {link_page_description}")

        page_url = ""
        for path in all_paths:
            just_filename = path.split("/")[-1]
            filename = path.replace(f"{docs_directory}/", "")

            # print('link_page_name:', link_page_name)
            # print(f"replace_links filename is {filename}")

            if (
                link_page_name + ".md" == filename
                or link_page_name + ".md" == just_filename
            ):
                page_url = path
                print(f"    Replacement Path: {page_url}")

        if len(page_url) > 0:

            # print(page_url)
            replacement_text = (
                "["
                + link_page_description.split("/")[-1]
                + "]("
                + page_url.replace(f"{docs_directory}/", f"{url_base}/")
                .replace(":", " -")
                .replace(".md", "")
                + ")"
            )
        else:
            replacement_text = full_wiki_link
        print(f"🔁 Replacement: {replacement_text}\n")

        output_text = output_text.replace(full_wiki_link, replacement_text)
    return output_text


def replace_mermaid_blocks(text):
    regex = r"(```mermaid(?P<mermaid>[\s\S]*?)```)"
    subst = "<script src='https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'></script><div class=mermaid>\\g<mermaid></div>"
    result = re.sub(regex, subst, text, 0, re.MULTILINE)
    return result


def replace_callouts(text):
    # 📝
    return text.replace("[!NOTE]", "📝")


def replace_url(path, all_paths, docs_directory, url_base):
    print(f"::group::{path}")

    full_text = get_file_full_text(path)
    replaced_text = replace_links(full_text, all_paths, docs_directory, url_base)
    replaced_text = replace_mermaid_blocks(replaced_text)
    replaced_text = replace_callouts(replaced_text)

    os.remove(path)
    with open(path.replace(":", " -"), "w") as f:
        f.write(replaced_text)
    print("::endgroup::")
