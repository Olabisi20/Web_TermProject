const crypto = require('crypto')

function hashPassword(tpassword){
    // random string as chars for salt length =16
    const len = 16;
    const salt = crypto.randomBytes(len/2).toString('hex')

    //SHA512 hash algorithm
    const hash = crypto.createHmac('sha512', salt);
    hash.update(tpassword);
    const hashed = hash.digest('hex')

    return {salt, hashed}
}

function verifyPassword(tpassword, user){
    const hash = crypto.createHmac('sha512', user.password.salt)
    hash.update(tpassword);
    const tpasswordHashed = hash.digest('hex');

    return tpasswordHashed == user.password.hashed;
}
module.exports = {hashPassword, verifyPassword}

/*const p1 ='password'
const hp1 = hashPassword(p1);
console.log(hp1);

const salt = 'd07a9127803ea9a1'
const hashed =  '83144ea7b3f6c59cf20cab088cb62c62b3c2a88bd1fe0f9dbac73f2892d9d0127b98f1845169c6f276d16a2e8d746ee007c5c8b0deabcb750428956959d7e536'
const user = { password: {salt, hashed}}

console.log('verify:', verifyPassword('password', user))*/