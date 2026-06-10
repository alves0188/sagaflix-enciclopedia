const mammoth = require("mammoth");

const path = process.argv[2];

mammoth.extractRawText({path: path})
    .then(function(result){
        const text = result.value; // The raw text
        console.log(text);
        if (result.messages.length > 0) {
            console.error(result.messages);
        }
    })
    .catch(function(err){
        console.error("Error reading docx:", err);
    });
