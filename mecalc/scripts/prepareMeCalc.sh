#!/bin/sh
MECALC_ENGINE_PATH=../engine

mkdir src/app/engine
mkdir src/assets/lib

tsc -p $MECALC_ENGINE_PATH
cp $MECALC_ENGINE_PATH/out/mecalc.d.ts src/app/engine
cp $MECALC_ENGINE_PATH/out/mecalc.js src/assets/lib

