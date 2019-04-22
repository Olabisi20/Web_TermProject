const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient;
const ObjectID =   mongodb.ObjectID;
const username = 'user';
const password = 'password';
const dbName = 'wsp'
const dbHost = 'localhost'
const dbPort = 27017
const collectionName = 'bloggers';
const blogCollectionName = 'blogs';

const dbUrl = `mongodb://${username}:${password}@${dbHost}:${dbPort}?authSource=${dbName}`;

const express = require('express');
const app = express();


let dbclient;
let bloggerCollection;
let blogCollection;

function startDBAndApp(app, PORT){
    MongoClient.connect(dbUrl, {poolSize: 20, useNewUrlParser: true})
        .then(client => {
            dbclient = client;
            bloggerCollection = client.db(dbName).collection(collectionName);
            blogCollection=client.db(dbName).collection(blogCollectionName);
            app.locals.bloggerCollection = bloggerCollection;
            app.locals.blogCollection= blogCollection;
            //app.locals.imageCollection = client.db(dbName).collection('images');
            //app.locals.commentCollection=client.db(dbName).collection('blogs').findOne('comment')
            app.locals.ObjectID = ObjectID
            app.listen(PORT, () => {
                console.log('Starting db')
            })

        })

        .catch(error => {
            console.log('dbconnection error: ', error)
        })
}

process.on('SIGINT', () => {
    dbclient.close();
    console.log('db conection closed by SIGINT')
    process.exit();

})

module.exports = {startDBAndApp, ObjectID, bloggerCollection, blogCollection }