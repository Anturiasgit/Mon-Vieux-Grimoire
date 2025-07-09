const express = require('express');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.post('/api/books', (req, res, next) => {
    console.log(req.body);
    res.status(201).json({
        message: 'Objet crée !'
    });
}); 

app.get('/api/books', (req, res, next) => {
    const books = [
        {
            _id: 'book1',
            title: 'Titre 1',
            author: 'Auteur 1',
            description: 'Description 1',
            imageUrl: 'https://cdn.pixabay.com/photo/2016/11/18/56/camera-4267692_1280.jpg',
            year: 2025,
            genre: 'Genre 1',
            ratings: [
                {
                    userId: 'Commentateur 1',
                    grade: 3,
                }
            ],
            averageRating: 3,
        },
        {
            _id: 'book2',
            title: 'Titre 2',
            author: 'Auteur 2',
            description: 'Description 2',
            imageUrl: 'https://image-url.com/hp1.jpg',
            year: 2025,
            genre: 'Genre 2',
            ratings: [
                {
                    userId: 'Commentateur 2',
                    grade: 4,
                }
            ],
            averageRating: 4,
        },
    ];
    res.status(200).json(books);
});

module.exports = app;