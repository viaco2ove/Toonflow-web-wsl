
# 2. 前端使用 UI 测试配置时，运行 
```
wsl
mkdir -p "/node_modules_wsl"
rsync -av --delete --exclude node_modules ./ /node_modules_wsl/
cd /node_modules_wsl
yarn install
yarn dev
```