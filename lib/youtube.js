const axios = require('axios')
const fs = require('fs');
const yts = require('yt-search');
const cmd = require('node-cmd');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const Catbox = require('catbox.moe');
const conc = require('concat-stream');
const FormData = require('form-data');

const cat = new Catbox.Litterbox("");

async function YT(a, num, callback){

    const reLink = new RegExp(/\?v=|be\//g);
    var result;
    var videos;
    // Смотрим есть ли ссылка на видео
    if (a.match(reLink)) {
        // Поиск по id если есть ссылка
        result = await yts({ videoId: a.substring(a.search(reLink) + 3) });
        videos = [result];
    } else {
        // Поиск по названию
        result = await yts(a);
        videos = result.videos.slice(0,1);
    }

    if (videos[0].seconds > 900) {
        console.log('Видео больше 15 минут, получаем прямую ссылку на файл...');
        // Если видео больше 15 минут, берем прямую ссылку с ютуба на webm файл
        cmd.run("yt-dlp -f \"ba*[ext=webm]\" --write-info-json --skip-download https://www.youtube.com/watch?v=" + videos[0].videoId + " -o \"./music/yt\"", (err, data, stderr) => {
            if (!err) {
                let info = JSON.parse(fs.readFileSync('./music/yt.info.json', 'utf8'));

                console.log('Send ok.');
                return callback({ title: info.title, link: info.url });
            } else {
                console.error(err);
            }
        });
    } else {
        // Запускаем скачку и конвертер в mp3 через cmd
        cmd.run("yt-dlp -f \"ba\" -x --audio-format mp3 --ffmpeg-location " + ffmpegPath + " https://www.youtube.com/watch?v=" + videos[0].videoId + " -o \"./music/" + num + "song.mp3\"", (err, data, stderr) => {
            if (!err) {
                // Отправляем на uguu.se
                delete fd;

                let fd = new FormData();

                fd.append('files[]', fs.createReadStream('./music/' + num + 'song.mp3'));
                fd.pipe(conc({encoding: 'buffer'}, data => {
                    axios.post('https://uguu.se/upload.php', data, {
                        headers: fd.getHeaders()
                    }).then(res => {
                        fs.unlink('./music/' + num + 'song.mp3', (error) => {
                            if (!error) {
                                console.log('Send ok.');
                                return callback({ title: videos[0].title, link: res.data.files[0].url });
                            } else {
                                console.error(error);
                            }
                        });
                    }).catch(e => {
                        // Если ошибка отправляем на catbox.moe
                        console.log('uguu.se недоступен: ', e);
                        cat.upload('./music/' + num + 'song.mp3').then(url => {
                            fs.unlink('./music/' + num + 'song.mp3', (error) => {
                                if (!error) {
                                    console.log('Send ok.');
                                    return callback({ title: videos[0].title, link: url });
                                } else {
                                    console.error(error);
                                }
                            });
                        }).catch(err => console.log('catbox.moe error: ', err));
                    })
                }))
            } else {
                console.error(err);
            }
        });
    }
}

module.exports = YT
