import sharp from 'sharp';
const out = '../site/public/model/';
await sharp('../model/src_base.png').resize(2048, 2048).webp({ quality: 84 }).toFile(out + 'base.webp');
await sharp('../model/src_normal.png').resize(2048, 2048).webp({ quality: 88 }).toFile(out + 'normal.webp');
await sharp('../model/src_orm.png').resize(1024, 1024).webp({ quality: 80 }).toFile(out + 'orm.webp');
