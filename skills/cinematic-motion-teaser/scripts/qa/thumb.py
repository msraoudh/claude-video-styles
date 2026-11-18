import sys
from PIL import Image
# usage: thumb.py out.png in1.png [in2.png ...]  -> grid 2 cols, each 960 wide
out=sys.argv[1]; ins=sys.argv[2:]
ims=[Image.open(p).convert('RGB') for p in ins]
w=960
ths=[]
for im in ims:
    r=w/im.width; ths.append(im.resize((w,int(im.height*r))))
cols=1 if len(ths)==1 else 2
rows=(len(ths)+cols-1)//cols
h=max(t.height for t in ths)
g=Image.new('RGB',(w*cols+(cols-1)*8,rows*h+(rows-1)*8),(255,0,255))
for i,t in enumerate(ths):
    g.paste(t,((i%cols)*(w+8),(i//cols)*(h+8)))
g.save(out)
