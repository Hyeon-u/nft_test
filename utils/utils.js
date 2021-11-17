function makeJson(name, description, imageUrl) {
    const result = {
        name: name,
        description: description,
        image: imageUrl
    }

    return result;
}

module.exports = {
    makeJson
}