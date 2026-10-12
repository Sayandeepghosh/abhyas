"""Rasterize the same geometric monogram used by icon.svg; requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
scale = 20
image = Image.new('RGB', (108*scale, 108*scale), '#172326')
draw = ImageDraw.Draw(image)

def stroke(points):
    scaled = [(round(x*scale), round(y*scale)) for x, y in points]
    draw.line(scaled, fill='white', width=7*scale, joint='curve')
    for x, y in [scaled[0], scaled[-1]]:
        radius = 3.5*scale
        draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill='white')

def curve(a,b,c,d):
    return [tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in [0,1]) for t in [i/100 for i in range(101)]]

stroke([(67,71),(67,45)]+curve((67,45),(67,28),(37,29),(37,43)))
stroke([(67,49),(49,49)]+curve((49,49),(29,49),(31,73),(47,73))+curve((47,73),(57,73),(63,68),(67,61)))
draw.ellipse((75*scale,65*scale,85*scale,75*scale), fill='#80c8bd')
for size in [192,512]:
    image.resize((size,size),Image.Resampling.LANCZOS).save(root/f'dist/icon-{size}.png')
