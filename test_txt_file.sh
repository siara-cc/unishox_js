node demo_unishox2.js -c $1.txt $1.usx
node demo_unishox2.js -d $1.usx $1.dsx
cmp $1.txt $1.dsx

