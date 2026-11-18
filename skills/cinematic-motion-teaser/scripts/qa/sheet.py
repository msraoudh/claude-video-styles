import sys
from PIL import Image
# usage: sheet.py out.png cols thumbW img1 img2 ...
out=sys.argv[1]; cols=int(sys.argv[2]); tw=int(sys.argv[3]); files=sys.argv[4:]
ims=[Image.open(f).convert("RGB") for f in files]
th=int(ims[0].height*tw/ims[0].width)
rows=(len(ims)+cols-1)//cols
sheet=Image.new("RGB",(cols*tw+(cols-1)*8, rows*th+(rows-1)*8),(255,0,255))
for i,im in enumerate(ims):
    im=im.resize((tw,th),Image.LANCZOS)
    sheet.paste(im,((i%cols)*(tw+8),(i//cols)*(th+8)))
sheet.save(out)
print(sheet.size)
