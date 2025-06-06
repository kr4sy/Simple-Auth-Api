const rentPostService = require('../services/rentPostService');

//-------------------------------------------------------------------------------------//
//----------------------------------dodaj ogłoszenie-----------------------------------//
//-------------------------------------------------------------------------------------//

exports.addRentPost = async (req, res) => {
  try {
    const adData = req.body
    const ad = await rentPostService.addRentPost(adData);
    res.status(201).json({ message: 'Ogłoszenie dodane', ad });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-----------------------------------lista ogłoszeń------------------------------------//
//-------------------------------------------------------------------------------------//

exports.getRentPosts = async (req, res) => {
  try {
    // Przekazuj wszystkie parametry z query do serwisu
    const postList = await rentPostService.getRentPosts(req.query);
    res.status(200).json(postList);
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
}

//-------------------------------------------------------------------------------------//
//-----------------------------------ogłoszenie po id----------------------------------//
//-------------------------------------------------------------------------------------//

exports.getRentPostById = async (req, res) => {
  try {
    const { id } = req.params; ``
    const rentPost = await rentPostService.getRentPostById(id); 
    res.status(200).json(rentPost); 
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//-----------------------------------dodaj promocje------------------------------------//
//-------------------------------------------------------------------------------------//

exports.addPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;
    const promotion = await rentPostService.addPromotion(id, startDate, endDate);
    res.status(201).json({ message: 'Promocja została ustawiona', promotion });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//-------------------------------------------------------------------------------------//
//----------------------------------wyświetl promocje----------------------------------//
//-------------------------------------------------------------------------------------//

exports.getPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await rentPostService.getPromotion(id);
    res.status(200).json(promotion);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};