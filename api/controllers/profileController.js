const profileService = require('../services/profileService');

//-------------------------------------------------------------------------------------//
//----------------------------------get info o profilu---------------------------------//
//-------------------------------------------------------------------------------------//

exports.getProfileInfoHandler = async (req, res) => {
    const rows = await profileService.getProfileInfo(req.user.id);
    if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }
    const user = rows[0];
    delete user.password;
    return res.status(200).json({
        firstName: user.first_name,
        surname: user.surname,
        email: user.email,
        phoneNumber: user.phone_number || null
    });
};

//-------------------------------------------------------------------------------------//
//---------------------------------zmień dane profilu----------------------------------//
//-------------------------------------------------------------------------------------//

exports.updateProfileInfoHandler = async (req, res) => {
    const userId = req.user.id;
    const { firstName, surname, email, phoneNumber } = req.body;
    try {
        await profileService.updateProfileInfo(userId, { firstName, surname, email, phoneNumber });
        return res.status(200).json({ message: 'Data has been updated' });
    } catch (error) {
        if (error.message === 'No data to update') {
            return res.status(400).json({ message: 'No data to update' });
        }
        if (error.message === 'Nie zmieniono żadnych danych') {
            return res.status(400).json({ message: 'Nie zmieniono żadnych danych' });
        }
        if (error.message === 'Imię musi mieć co najmniej 2 znaki') {
            return res.status(400).json({ message: 'Imię musi mieć co najmniej 2 znaki' });
        }
        if (error.message === 'Nazwisko musi mieć co najmniej 2 znaki') {
            return res.status(400).json({ message: 'Nazwisko musi mieć co najmniej 2 znaki' });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(500).json({ message: 'Server error has occured' });
    }
};

//-------------------------------------------------------------------------------------//
//-------------------------------------zmień hasło-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.updatePasswordHandler = async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing required data' });
    }
    try {
        const isMatch = await profileService.checkPassword(userId, oldPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Wrong password' });
        }
        await profileService.updateProfilePassword(userId, newPassword);
        return res.status(200).json({ message: 'Password has beed updated succesfully' });
    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(500).json({ message: 'Server error has occurred' });

    }
};