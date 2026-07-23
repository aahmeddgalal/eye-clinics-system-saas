import os
import re

directory = r'd:\drsabry\clinic-system\src'

def update_classes(match):
    tag = match.group(1)
    attrs = match.group(2)
    
    # Extract className
    class_match = re.search(r'className=([\'"])(.*?)\1', attrs)
    if not class_match:
        class_match = re.search(r'className=\{`([^`]*?)`\}', attrs) # Handle template literals
    
    if class_match:
        old_classes = class_match.group(2) if len(class_match.groups()) > 1 else class_match.group(1)
        
        # Remove old conflicting classes
        new_classes = re.sub(r'\b(text-slate-\d+|text-gray-\d+|bg-slate-\d+|bg-white|border-slate-\d+|border-gray-\d+|border-transparent|focus:border-transparent|focus:border-blue-\d+|focus:ring-blue-\d+|focus:ring-\S+|placeholder-slate-\d+|placeholder-gray-\d+|outline-none|border)\b', '', old_classes)
        
        # Add required classes
        required = 'bg-white text-[#111827] border border-[#D1D5DB] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#1434A4] focus:border-[#1434A4] outline-none'
        
        # Clean up multiple spaces
        final_classes = ' '.join(f'{new_classes} {required}'.split())
        
        # Reconstruct attrs
        if 'className="' in attrs:
            new_attrs = re.sub(r'className="[^"]*"', f'className="{final_classes}"', attrs)
        elif "className='" in attrs:
            new_attrs = re.sub(r"className='[^']*'", f"className='{final_classes}'", attrs)
        else:
            new_attrs = re.sub(r'className=\{`[^`]*`\}', f'className={{`{final_classes}`}}', attrs)
            
        return f'<{tag}{new_attrs}'
    
    return match.group(0)

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = re.sub(r'<(input|textarea|select)([^>]*?)', update_classes, content, flags=re.DOTALL)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {filepath}')
