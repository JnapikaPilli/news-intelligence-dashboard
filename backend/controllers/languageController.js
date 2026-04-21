// Placeholder for user preferences, normally stored in a DB

let userPreferences = {
    language: 'English'
};

exports.getPreferences = async (req, res) => {
    res.json(userPreferences);
};

exports.updatePreferences = async (req, res) => {
    const { language } = req.body;
    if (language) {
        userPreferences.language = language;
    }
    res.json(userPreferences);
};
