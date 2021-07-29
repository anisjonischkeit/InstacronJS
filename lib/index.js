const Instagram = require('instagram-web-api')
const Dropbox = require('dropbox')
const fetch = require('node-fetch')
const emoji = require('random-unicode-emoji');
var exif = require('exif2');

const getPhoto = async (dbx) => {
    const files = await dbx.filesListFolder({path: ''})
    const uploadedFiles = await dbx.filesListFolder({path: '/uploaded'})
    const photoToUpload = files.result.entries.find(file => 
        file[".tag"] == "file" &&
            uploadedFiles.result.entries.every(
                uploadedFile => uploadedFile.name != file.name
            )
    )
    if (!photoToUpload) {
        return null
    }

    const photo = await dbx.filesDownload({path: photoToUpload.id})
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

const upload = async (client, photo, caption, uploadCallback) => {
    console.log("login")
    await client.login()
    console.log("upload")
    await client.uploadPhoto({photo: photo.fileBinary, caption: caption})
    await uploadCallback(photo)

    // console.log("logout")
    // await client.logout()
}

const markFileAsUploaded = async (client, photo) => {
    console.log("saving as uploaded")
    await client.filesCopyV2({from_path: photo.path_display, to_path: `/uploaded${photo.path_display}`})
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
    if (!photo) {
        console.log("no photo found that wasn't already uploaded")
        return null
    }

    console.log("make caption")
    const bin = await photo.fileBinary
    const caption = await makeCaption(bin)
    try {
        await upload(ig, photo, caption, markFileAsUploaded.bind(null, dbx))
    } catch (error) {
        console.error(error);
    }
}

exports.run = run
