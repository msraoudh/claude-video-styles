import sys
from PIL import Image, ImageChops, ImageStat
a=Image.open(sys.argv[1]).convert("RGB"); b=Image.open(sys.argv[2]).convert("RGB")
print("sizes", a.size, b.size)
d=ImageChops.difference(a,b)
bbox=d.getbbox()
st=ImageStat.Stat(d)
mx=max(e[1] for e in d.getextrema())
px=sum(1 for p in d.getdata() if max(p)>8)
print("bbox", bbox, "max", mx, "mean", [round(m,4) for m in st.mean], "pixels>8:", px)
