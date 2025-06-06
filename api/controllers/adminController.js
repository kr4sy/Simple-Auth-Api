const adminService = require('../services/adminService');

//-------------------------------------------------------------------------------------//
//-------------------------------------add feature-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.addFeature = async (req, res) => {
  try {
    const { title, img_src } = req.body;
    await adminService.addFeature({ title, img_src });
    res.status(201).json({ message: 'Feature (category) added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-------------------------------------dodaj admina------------------------------------//
//-------------------------------------------------------------------------------------//

exports.addAdmin = async (req, res) => {
  try {
    const { firstName, surname, email, password } = req.body;
    await adminService.addAdmin({ firstName, surname, email, password });
    res.status(201).json({ message: 'Admin added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-------------------------------------usuń admina-------------------------------------//
//-------------------------------------------------------------------------------------//

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteAdmin(id);
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-----------------------------------wyświetl userów-----------------------------------//
//-------------------------------------------------------------------------------------//

exports.getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-------------------------------------usun usera--------------------------------------//
//-------------------------------------------------------------------------------------//

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    res.status(200).json({ message: 'User anonymized (is_deleted=true)' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
