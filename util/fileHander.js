const fs = require('fs');


exports.deletefile = async (path) => {
    try {
        const status = await fs.unlink(path);
    }
    catch (err) {
        return new Error(err);
    }
}