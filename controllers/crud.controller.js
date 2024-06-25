const mongoose = require("mongoose");

module.exports = {
    read: async (req, res) => {
        const { collection } = req.params
        const limit = req.query.limit || 25
        delete req.query.limit
        const skip = req.query.skip || 0
        delete req.query.skip
        const selector = req.query
        selector['capabilities.read'] = { $in: req.user.email }
        try {
            const items = await mongoose.model(collection).find(selector).limit(limit).skip(skip);
            // res.status(200).json(items);
            return items
        } catch (error) { res.status(500).json({ message: error.message }); }
    },
    readOne: async (req, res, next) => {
        try {
            const { collection, id } = req.params;
            req.item = await mongoose.model(collection).findOne({ _id: id, 'capabilities.read': { $in: req.user.email } });
            // await req.item.save()
            next()
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },
    create: async (req, res, next) => {
        try {
            console.log("create");
            const { collection } = req.params
            const item = new mongoose.model(collection)(req.body)
            console.log('item', item);
            item.capabilities.read.addToSet(req.user.email)
            item.capabilities.update.addToSet(req.user.email)
            item.capabilities.delete.addToSet(req.user.email)
            await item.save()
            return item
        } catch (error) {
            res.status(500).json({ message: error.message });
        }

    },
    update: async (req, res) => {
        try {
            const { id, collection } = req.params;
            const updating = await mongoose.model(collection).updateOne(
                {
                    _id: id,
                    'capabilities.update': { $in: req.user.email },
                    'capabilities.read': { $in: req.user.email }
                }, req.body)
            res.status(200).json(updating);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const { id, collection } = req.params;
            const deleting = await mongoose.model(collection)
                .deleteOne({ _id: id, 'capabilities.delete': { $in: req.user.email } });
            res.status(200).json(deleting);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}