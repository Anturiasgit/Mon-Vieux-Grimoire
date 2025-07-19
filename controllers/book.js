const Book = require('../models/Book');
const fs = require('fs/promises');
const sharp = require('sharp');
const path = require('path');

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const inputPath = req.file.path;
    const filename = req.file.filename.replace(/\.[^.]+$/, '.webp');
    const outputPath = path.join(path.dirname(inputPath), filename);

    await sharp(inputPath)
      .resize({ withoutEnlargement: true })
      .webp()
      .toFile(outputPath);

    await fs.unlink(inputPath);

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`
    });

    await book.save();
    res.status(201).json({ message: 'Livre enregistré !' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.modifyBook = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    let bookObject = {};

    if (req.file) {

      const inputPath = req.file.path;
      const filename = req.file.filename.replace(/\.[^.]+$/, '.webp');
      const outputPath = path.join(path.dirname(inputPath), filename);

      await sharp(inputPath)
        .resize({ width: 800, withoutEnlargement: true })
        .webp()
        .toFile(outputPath);

      await fs.unlink(inputPath);

      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`
      };
    } else {
      bookObject = { ...req.body };
    }

    delete bookObject._userId;

    const book = await Book.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    if (book.userId != req.auth.userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Supprime l'ancienne image du serveur si nouvelle image envoyée
    if (req.file && book.imageUrl) {
      const oldImageFilename = book.imageUrl.split('/images/')[1];
      const oldImagePath = path.join(__dirname, '../images', oldImageFilename);

      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.warn('Ancienne image non supprimée (peut-être déjà absente) :', error.message);
      }
    }

    await Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId });
    res.status(200).json({ message: 'Livre modifié !' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    if (book.userId != req.auth.userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (book.imageUrl) {
      const filename = book.imageUrl.split('/images/')[1];
      const imagePath = path.join(__dirname, '../images', filename);

      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.warn('Image déjà supprimée ou introuvable :', err.message);
      }
    }

    await Book.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Livre supprimé !' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.rateBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    const alreadyRated = book.ratings.some(rating => rating.userId === req.auth.userId);
    if (alreadyRated) {
      return res.status(400).json({ error: 'Vous avez déjà noté ce livre.' });
    }

    book.ratings.push(req.body);

    const totalRatings = book.ratings.length;

    const sum = book.ratings.reduce((acc, ratingsObject) => {
      const note = ratingsObject.rating ?? ratingsObject.grade;
      return acc + note;
    }, 0);

    book.averageRating = sum / totalRatings;

    await book.save();
    
    res.status(201).json(book);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.getBestBooks = (req, res, next) => {
  Book.find()
  .sort({ averageRating: -1 })
  .limit(3)
  .then(books => res.status(200).json(books))
  .catch(error => res.status(400).json({ error }));
};

