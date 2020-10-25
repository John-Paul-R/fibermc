from numpy import base_repr
from os import path as paths
from time import time

def timestamp(base=36):
    return str(base_repr(int(time()), base))

def writeTimestampedFile(inPath, data, outDir=""):
    fileName, fileExt = paths.splitext(paths.split(inPath)[1])
    outFileName = fileName + "_Itemized-" + timestamp() + fileExt
    print("Writing to \"" + outFileName +"\"...")
    with open(paths.join(outDir, outFileName), 'w', encoding='utf8') as outFile:
        outFile.write(data)
        print("File write complete! Output file at: \"" + paths.realpath(outFile.name)+"\"")
        return paths.realpath(outFile.name)