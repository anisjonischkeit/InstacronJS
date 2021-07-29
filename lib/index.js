const Instagram = require('instagram-web-api')
const Dropbox = require('dropbox')
const fetch = require('node-fetch')

const getPhoto = async (dbx) => {
    const files = await dbx.filesListFolder({path: ''})
    const photoRef = files.result.entries[0]
    const photo = await dbx.filesDownload({path: photoRef.id})
    return photo.result
}

const getQuote = async () => {
    return fetch('https://api.quotable.io/random')
        .then(response => response.json())
}

const makeCaption = async (photo) => {
    quote = await getQuote()
    return quote.content
}

const upload = async (client, photo, caption) => {
    console.log("login")
    await client.login()
    console.log("upload")
    await client.uploadPhoto({photo: photo.fileBinary, caption: caption})
    console.log("logout")
    await client.logout()
}

const run = async () => {
    console.log("running instacron")
    const { 
        IG_USERNAME: username, 
        IG_PASSWORD: password, 
        DROPBOX_TOKEN: dbxtoken 
    } = process.env
    
    const ig = new Instagram({ username, password })
    const dbx = new Dropbox.Dropbox({ accessToken: dbxtoken });

    console.log("get photo")
    const photo = await getPhoto(dbx)
    console.log("make caption")
    const caption = await makeCaption(photo)
    return await upload(ig, photo, caption)
}

exports.run = run
