const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const cors = require('cors')
const { uploader } = require('./uploader')
const fs = require('fs')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
// const { kucing, jerapah } = require('./jwt')
const { createJWTToken } = require('./jwt')

const app = express()
const port = process.env.PORT || 1997

const db = mysql.createConnection({   //KALO MAU EXECUTE QUERY KE MYSQL
    host: 'localhost',
    user: 'Putu Dewanti',
    password: 'abc123',
    database: 'berkah',
    port: 3306,
    // multipleStatements: true
    // timezone: 'UTC'
})

const transporter = nodemailer.createTransport({    //KIRIM EMAIL
    service: 'gmail',
    auth: {
        user: 'putu.dewanti@gmail.com',
        pass: 'spvrzzkbqxonxxqf'
    },
    tls: {
        rejectUnauthorized: false
    }
})

app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.status(200).send('<h1>Welcome To our API</h1>')
})

app.get('/sendmail', (req, res) => {
    var mailOption = {
        from: "Penguasa Toko Berkah <putu.dewanti@gmail.com>",
        to: "putu.dewanti@gmail.com",
        subject: "Undangan Bergabung",
        html: `Bergabunglah menjadi member Toko Berkah dengan
            mengclick link ini  <a href="https://google.com">Bergabung</a>`
    }

    transporter.sendMail(mailOption, (err, results) => {
        if (err) return res.status(500).send(err)

        res.status(200).send({ status: 'Send Email Success', result: results })
    })
})

app.get('/getkota', (req, res) => {
    var nama = req.query.nama ? req.query.nama : '';

    var sql = `SELECT * FROM kota WHERE nama LIKE '%${nama}%';`;
    db.query(sql, (err, results) => {
        if (err) {
            // console.log(err)
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})
// http://localhost:1997/getkota/bebas/test/halo/4124/testing
// app.get('/getkota/:idu/test/halo/:hello/:coba', (req,res) => {
//     console.log(req.params)
//     res.status(200).send('<h1>Halo Bro</h1>')
// })

app.get('/getkota/:id', (req, res) => {
    var sql = `SELECT * FROM kota WHERE id=${db.escape(req.params.id)};`;

    console.log(sql)
    db.query(sql, (err, results) => {
        if (err) {
            // console.log(err)
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})

app.get('/gettoko', (req, res) => {
    var nama = req.query.nama || '';
    var alamat = req.query.alamat || '';

    var sql = `SELECT t.*, k.nama as namaKota FROM toko t
                JOIN kota k
                ON t.kotaId = k.id
                WHERE t.nama LIKE '%${nama}%' 
                AND alamat LIKE '%${alamat}%'`;

    if (req.query.incmin) {
        sql += ` AND totalIncome >= ${req.query.incmin}`
    }
    if (req.query.incmax) {
        sql += ` AND totalIncome <= ${req.query.incmax}`
    }
    if (req.query.datefrom) {
        sql += ` AND tanggalBerdiri >= '${req.query.datefrom}'`
    }
    if (req.query.dateto) {
        sql += ` AND tanggalBerdiri <= '${req.query.dateto}'`
    }
    if (req.query.kotaid) {
        sql += ` AND kotaId = ${req.query.kotaid}`
    }

    db.query(sql, (err, results) => {
        if (err) {
            // console.log(err)
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})

app.get('/gettoko/:id', (req, res) => {
    var sql = `SELECT * FROM toko WHERE id=${req.params.id};`;

    db.query(sql, (err, results) => {
        if (err) {
            // console.log(err)
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})

app.post('/addkota', (req, res) => {
    var kota = req.body.insertkota;

    if (kota) {
        var sql = `INSERT INTO kota (nama) values ? `

        db.query(sql, [kota], (err, results) => {
            if (err) {
                return res.status(500).send(err)
            }
            sql = `SELECT * from kota;`

            db.query(sql, (err, results) => {
                if (err) return res.status(500).send(err)

                res.status(200).send(results)
            })
        })
    }
    else {
        res.status(500).send('Tolong isi query insertkota')
    }
})

app.put('/editkota/:id', (req, res) => {
    var data = req.body;
    var sql = `UPDATE kota SET ? WHERE id = ${req.params.id}`

    db.query(sql, data, (err, results) => {
        if (err) {
            return res.status(500).send(err)
        }

        sql = `SELECT * from kota;`
        db.query(sql, (err, results1) => {
            if (err) return res.status(500).send(err)

            res.status(200).send(results1)
        })
    })
})

app.delete('/deletekota/:id', (req, res) => {
    var sql = `DELETE FROM kota WHERE id = ${req.params.id}`

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})

app.post('/addtoko', (req, res) => {
    var newToko = req.body;
    console.log(newToko)
    if (newToko) {
        var sql = `INSERT INTO toko SET ? `

        db.query(sql, newToko, (err, results) => {
            if (err) {
                return res.status(500).send(err)
            }

            res.status(200).send(results)
        })
    }
    else {
        res.status(500).send('Tolong kasih Body')
    }
})

app.delete('/deletetoko/:id', (req, res) => {
    var sql = `DELETE FROM toko WHERE id = ${db.escape(req.params.id)}`

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})

app.put('/edittoko/:id', (req, res) => {
    var sql = `UPDATE toko SET ? WHERE id = ${req.params.id};`;
    db.query(sql, req.body, (err, results) => {
        if (err) {
            return res.status(500).send(err)
        }

        res.status(200).send(results)
    })
})

app.post('/addimagetoko', (req, res) => {
    const path = '/images/toko';
    const upload = uploader(path, 'TOK').fields([{ name: 'image' }]);

    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Upload file failed !', error: err.message });
        }

        const { image } = req.files;
        console.log(image)

        console.log(req.body.data)
        const data = JSON.parse(req.body.data);
        console.log(data)
        var insertData = []
        for (var i = 0; i < image.length; i++) {
            insertData.push([`${path}/${image[i].filename}`, data.tokoId])
        }

        var sql = `INSERT INTO imagetoko (pathName,tokoId) VALUES ? `;
        db.query(sql, [insertData], (err, results) => {
            if (err) {
                for (var i = 0; i < image.length; i++) {
                    fs.unlinkSync('./public' + path + '/' + image[i].filename)
                }
                return res.status(500).send(err)
            }

            res.status(200).send(results)
        })
    })
})

// var multer  = require('multer')
// var upload = multer({ dest: 'uploads/' })

// app.post('/testcontoh', upload.single('image'), (req,res,next) => {
//     console.log(req.file)
//     console.log(req.body)
//     res.send('test')
// })

app.get('/imagetoko/:id', (req, res) => {
    var sql = `SELECT it.*, t.nama as NamaToko from imagetoko it
            JOIN toko t
            ON t.id = it.tokoId
            WHERE tokoId = ${db.escape(req.params.id)}`;
    console.log(sql)
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err)

        res.status(200).send(results)
    })
})

app.put('/imagetoko/:id', (req, res) => {
    var sql = `SELECT * FROM imagetoko WHERE id = ${db.escape(req.params.id)}`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err)

        if (results.length > 0) {
            const path = '/images/toko';
            const upload = uploader(path, 'TOK').fields([{ name: 'image' }]);

            upload(req, res, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Upload file failed !', error: err.message });
                }

                const { image } = req.files;
                console.log(image)


                const data = { pathName: path + '/' + image[0].filename }

                sql = `UPDATE imagetoko SET ? WHERE id = ${req.params.id};`
                db.query(sql, data, (err, results1) => {
                    if (err) {
                        fs.unlinkSync('./public' + path + '/' + image[0].filename)
                        return res.status(500).send(err)
                    }

                    fs.unlinkSync('./public' + results[0].pathName)
                    res.status(200).send(results1)
                })
            })
        }
    })
})
// http://localhost:1997/imagetoko/6 DELETE
app.delete('/imagetoko/:id', (req, res) => {
    var sql = `SELECT * FROM imagetoko WHERE id = ${db.escape(req.params.id)}`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err)

        sql = `DELETE FROM imagetoko WHERE id = ${db.escape(req.params.id)}`;
        db.query(sql, (err, results1) => {
            if (err) return res.status(500).send(err)

            fs.unlinkSync('./public' + results[0].pathName)

            res.status(200).send(results1)
        })
    })
})

// var nama = `' or ''='`
// var password = `' or ''='`

// var sql = `SELECT * from users where username = ${db.escape(nama)} and password = '${password}'`;

app.post('/register', (req, res) => {
    req.body.status = 'Unverified'
    req.body.tanggalBergabung = new Date()

    const secret = 'teletubies'; //SECRET JGN SAMPAI KETAHUAN
    req.body.password = crypto.createHmac('sha256', secret)
        .update(req.body.password)
        .digest('hex');

    var sql = `SELECT * FROM users WHERE email = '${req.body.email}';`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send({ message: 'Database Error Bro!', err, error: true })

        if (results.length > 0) {
            return res.status(500).send({ message: 'Email has been taken!', error: true }) //status 500 supaya masuk ke CATCH DI FRONT END
        }

        sql = `INSERT INTO users SET ? `;
        db.query(sql, req.body, (err, results) => {
            if (err) return res.status(500).send({ message: 'Database Error Bro!', err, error: true })

            var mailOption = {
                from: "Toko Berkah <putu.dewanti@gmail.com>",
                to: req.body.email,
                subject: "Email Confirmation",
                html: `Verified your email by clicking this link <a href="http://localhost:3000/emailverified?email=${req.body.email}">Verified</a>`
            }

            transporter.sendMail(mailOption, (err, results) => {
                if (err) return res.status(500).send({ message: 'Kirim Email Confirmation Gagal!', err, error: false, email: req.body.email })

                res.status(200).send({ status: 'Send Email Success', result: results, email: req.body.email })
            })
        })
    })
})

app.get('/testencrypt', (req, res) => {
    const secret = 'teletubies'; //SECRET JGN SAMPAI KETAHUAN
    const hash = crypto.createHmac('sha512', secret)
        .update('abc')
        .digest('hex');
    console.log(hash.length)
    res.status(200).send(hash)
})

app.post('/resendemailconfirm', (req, res) => {
    var mailOption = {
        from: "Toko Berkah <putu.dewanti@gmail.com>",
        to: req.body.email, //FRONT END MENENTUKAN KE MANA EMAIL DI KIRIM
        subject: "Email Confirmation",
        html: `Verified your email by clicking this link 
        <a href="http://localhost:3000/emailverified?email=${req.body.email}">Verified</a>`
    }

    transporter.sendMail(mailOption, (err, results) => { //MAIL BARU DI KIRIM DI SINI
        if (err) return res.status(500).send({ message: 'Kirim Email Confirmation Gagal!', err })

        res.status(200).send({ message: 'Send Email Success', result: results })
    })
})

app.post('/confirmemail', (req, res) => {
    var sql = `UPDATE users  SET status = 'Verified' WHERE email = '${req.body.email}';`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send({ status: 'error', err })

        sql = `SELECT id,username,email,status FROM users WHERE email = '${req.body.email}';`; //HABIS SELECT DAPATNYA ARRAY
        db.query(sql, (err, results) => {
            if (err) return res.status(500).send({ err })

            var token = createJWTToken({ ...results[0] })

            res.status(200).send({ ...results[0], token }) //isi result  = object , ISI ARRAY DARI RESULTS = 1 KRN EMAIL GA BOLEH SAMA
        })
    })
})

// app.get('/bikintoken', (req, res) => {
//     var hasilEncrypt = kucing({ message: 'Kita Keren', code: 10010101, cihuy: 'test' })
//     console.log('di bikin token', hasilEncrypt)
//     res.status(200).send(`<h2>${hasilEncrypt}</h2>`)
// })

// app.get('/checktoken/:token', (req, res) => {
//     jerapah(req.params.token, (kadaluarsa, hasil) => {
//         if (kadaluarsa) return res.status(500).send('Token Kadaluarsa Bro')

//         console.log('Ini di checktoken', hasil)
//         res.status(200).send(hasil)
//     })
// })



app.listen(port, () => console.log(`API aktif di port ${port}`))