from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # threshold for white
    for item in datas:
        # item is (R, G, B, A)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # enhance contrast to make it pop more
    img.save(output_path, "PNG")

remove_white_bg('imagelogo.jpg', 'logo_transparent.png')
