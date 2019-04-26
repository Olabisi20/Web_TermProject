const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
var async = require('async');
var crypto = require('crypto');
const session = require('express-session')

// to read data from form tag Post method, use the middleware below
app.use(express.urlencoded({exteded: false}))

app.use(session(
    {
        secret: 'secretcode!#$!@!@#$@',
        resave: false,
        savedUnininitialized: false,
    }
));
app.use('/public', express.static(__dirname + '/public'));

const database = require('./database.js');
database.startDBAndApp(app, PORT);


const flash = require('connect-flash')
app.use(flash())


const passConfig = require('./passConfig.js')
passConfig.config(app)



//template engine for ejs
app.set('view engine', 'ejs');

//set location for ejs file
app.set('views', './ejsviews');

app.get('/', (req, res) =>{
    res.render('home');
})

app.get('/signup', (req, res) =>{
    res.render('signup', {flash_message: req.flash('flash_message')});
})

app.post('/signup', passConfig.passport.authenticate(
    'signupStrategy',
    {successRedirect: '/loginhome', failureRedirect: '/signup', failureFlash: true}
))

app.get('/login', (req, res) =>{
   // res.render('login');
    res.render('login', {flash_message: req.flash('flash_message') })
})


app.post('/login', passConfig.passport.authenticate(

    'localLogin',
    {
        successRedirect: '/loginhome', 
        failureRedirect: '/login',
        failureFlash: true
    }
) 
);


app.get('/loginhome', auth,(req, res) =>{
     res.render('loginhome', {user:req.user});
})


app.get('/news', (req, res) => {
    app.locals.blogCollection.find({}).toArray()
    .then(blogs =>{
       res.render('news', {blogs});
        
    })
    .catch(error => {
        res.send(error)
    })
})

app.get('/viewUpdateNews', (req, res) => {
    app.locals.blogCollection.find({}).toArray()
    .then(blogs =>{
       res.render('viewUpdateNews', {blogs});
        
    })
    .catch(error => {
        res.send(error)
    })
})

app.post('/comment', (req, res) => {
    const _id = req.body._id;
    const comments = req.body.comments;
    const query={_id:database.ObjectID(_id)}

    app.locals.blogCollection.insertOne(query, comments)
        .then(result => {
            res.redirect('/news')
        })
        .catch(error => {
            res.render('errorPage', {message: error})
        })
    })


 app.get('/logout', (req, res) => {
     req.logout()
    res.render('home')
})

app.get('/admin/adminhome', authAsAdmin, (req, res) =>{
    res.render('admin/adminhome', {user: req.user})
})

app.get('/admin/adminDelete', (req, res) => {
    app.locals.blogCollection.find({}).toArray()
    .then(blogs =>{
       res.render('admin/adminDelete', {blogs});
        
    })
    .catch(error => {
        res.send(error)
    })
})

app.post('/admin/adminDelete', (req, res) => {
    const _id = req.body._id;
    const blogToDelete = {_id: database.ObjectID(_id)};
    app.locals.blogCollection.deleteOne(blogToDelete)
        .then(result => {
            
            res.redirect('/admin/adminDelete')
        })
        .catch(error => {
            res.render('401', {source: '/admin/adminDelete', error})
        })
})

const multer = require('multer');
const path = require('path');

const MAX_FILESIZE = 1020 * 1024 *2// 2 mb
const fileTypes = /jpeg|jpg|png|gif/;

const storageOptions = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/images');
    },
    filename: (req, file, callback) => {
        callback(null, 'image'+Date.now()+path.extname(file.originalname))
    }
})

const imageUpload = multer( {
    storage: storageOptions,
    limits: {fileSize: MAX_FILESIZE},
    fileFilter: (req, file, callback) => {
        const ext = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if(ext && mimetype){
            return callback(null, true)
        }else{
            return callback('Error: Images (jpeg, jpg, png, git) only');
        }
    }
}).single('imageButton');

app.get('/postNews', (req, res) => {
    res.render('postNews')
})

app.post('/postNews', (req, res) => {
    imageUpload(req, res, error => {
        if(error){
            return res.render('errorPage', {message: error})
            
        }else if(!req.file){
            return res.render('errorPage', {message: 'No file selected'});
        }
  
   const image = req.file.filename
    const title = req.body.title
    const news = req.body.news
    
    const blog = {image, title, news}
    console.log(`${image}`)

    app.locals.blogCollection.insertOne(blog)
        .then(result => {
            res.redirect('/viewUpdateNews')
            
        })
        .catch(error => {
            res.render('errorPage', {source: '/postNews', error})
        })
        console.log(`${blog}`)
        console.log(`${JSON.stringify(blog)}`)
    })

})
app.get('/update', (req, res) =>{
    const _id = req.query._id;
    app.locals.blogCollection.find({_id:database.ObjectID(_id)}).toArray()
    .then(blogs => {
        //console.log(blogs[0]);
        if (blogs.length != 1){
            throw `Found ${blogs.length} blogs for Update`
        }
        res.render('update', {blogs: blogs[0]})
    })
    .catch(error =>{
        console.log("Error 1")
        res.render('401', {source: '/update', error})
    })
})

app.post('/update', (req, res) => {
    const _id = req.body._id;
    const image = req.body.images
    const title = req.body.title;
    const news = req.body.news;
   

    const query = {
        _id: database.ObjectID(_id)
    }
    const newValue = {
        $set: {
            image,
            title,
            news
        }
    }
    app.locals.blogCollection.updateOne(query, newValue)
        .then(result => {
            res.redirect('/viewUpdateNews');
        })
        .catch(error => {
            res.render('401', {source: '/update(POST)',error})
            console.log("Error 2")
        });
})



function auth(req, res, next){
    const user = req.user;

    if(!user){
        res.render('401')
    } else{
        next();
    }
}

function authAsAdmin(req, res, next){
    const user = req.user;

    if(!user || !user.admin){
        res.render('401')
    } else{
        next();
    }
}

app.get('/about', (req, res) => {
    res.render('about')
})

app.get('/contact', (req, res) => {
    res.render('contact')
})

app.post('/contact', (req, res) => {
    var nodemailer = require('nodemailer');    
        let mailOpts, smtpTrans;
        smtpTrans = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: 'formultipurposereasons@gmail.com',
            pass: 'Multipurpose1@'
          }
        });
        mailOpts = {
          from: req.body.name + ' &lt;' + req.body.email + '&gt;',
          to: 'formultipurposereasons@gmail.com',
          subject: 'New message from contact form at Streamline Blog',
          text: `${req.body.fullname} (${req.body.email}) says: ${req.body.message}`
        };
        smtpTrans.sendMail(mailOpts, function (error, response) {
          if (error) {
            res.render('401');
          }
          else {
            res.render('home');
          }
        });
      });


app.get('/reset',(req, res) =>{

})

app.get('/forgotpassword', (req, res) => {
    res.render('forgotpassword')
})

app.post('/forgotpassword', (req, res) => {
    const email = req.body.email


var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'formultipurposereasons@gmail.com',
    pass: 'Multipurpose1@'
    }
});

var mailOptions = {
    from: 'formultipurposereasons@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: 'You are receiving this because you have requested the reset of the password for your account.\n\n' +
'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
'http://' + req.headers.host + '/reset/' /*+ token*/ + '\n\n' +
'If you did not request this, please ignore this email and your password will remain unchanged.\n'
};


transporter.sendMail(mailOptions, function(error, info){
if (error) {
    console.log(error);
} else {
    console.log('Email sent: ' + info.response);
    }
    })
})
