import os
import re

mapping = [
    (r'du-hoc-.*\.html$', 'service-du-hoc.html', '&larr; Quay lại danh mục Du học'),
    (r'ky-su-.*\.html$', 'service-ky-su.html', '&larr; Quay lại danh mục Kỹ sư'),
    (r'tieng-nhat-.*\.html$', 'service-tieng-nhat.html', '&larr; Quay lại danh mục Tiếng Nhật')
]

for fname in os.listdir('.'):
    if not fname.endswith('.html'): continue
    if fname.startswith('service-') or fname == 'index.html': continue
    
    for pat, link, text in mapping:
        if re.search(pat, fname):
            with open(fname, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The HTML contains things like:
            # <a href="index.html#services" style="...">... Quay lại ... </a>
            
            # Let's target any link that contains "Quay lại danh sách dịch vụ" or similar
            # And replace it with the new link and text.
            
            new_content = re.sub(
                r'<a\s+href="[^"]*"([^>]*)>\s*&larr;\s*Quay lại[^<]*</a>',
                f'<a href="{link}"\\1>{text}</a>',
                content
            )
            
            if new_content != content:
                with open(fname, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {fname}')
            else:
                print(f'No changes for {fname}')
            break
