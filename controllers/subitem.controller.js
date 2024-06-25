const mongoose = require('mongoose')
// const crudController = require('./crud.controller')

module.exports = {
    add: async (req, res) => {
        try {
            const { collection, id, type } = req.params

            // get item
            const item = await mongoose.model(collection).findOne({
                _id: id,
                'capabilities.read': { $in: req.user.email },
                'capabilities.update': { $in: req.user.email }
            });
            if (item === null) return res.status(500).json({ message: 'no item founded !' })

            // create or get subitem
            req.body[collection] = [id]
            var subItem = await new mongoose.model(type)(req.body)
            // console.log('subItem', subItem);

            // check if exist
            var existing = false
            var selector = { $or: [] }
            if (type === 'recruiters') {
                if (subItem.phone) selector.$or.push({ phone: subItem.phone })
                if (subItem.email) selector.$or.push({ email: subItem.email })
            }
            if (selector.$or.length > 0) {
                const existingItem = await mongoose.model(type).findOneAndUpdate(selector, req.body, { new: true })
                // console.log("existingItem", existingItem);
                if (existingItem !== null) {
                    // console.log('item exist');
                    existing = true
                    subItem = existingItem
                }
            }

            // add permissions to subItem
            subItem.capabilities.read.addToSet(req.user.email)
            subItem.capabilities.update.addToSet(req.user.email)
            subItem.capabilities.delete.addToSet(req.user.email)

            // save subItem
            await subItem.save()

            // add event
            const event = await new mongoose.model('events')({
                name: `New ${collection} created`,
                user: req.user._id,
                [collection]: [item._id]
            })
            await event.save()

            // update main item
            console.log("update main item");
            if (!item[type]) item[type] = []
            item[type].addToSet(subItem._id)
            if (!item.events) item[type] = []
            item.events.addToSet(event._id)
            await item.save()

            // return
            res.status(200).json({ [collection]: item, subItem, message: `${subItem.name} has been added to ${item.name}` })
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
        // next()
    },
    extend: async (req, res) => {
        try {
            const { type } = req.params
            const item = req.item
            var response = {}

            if (type) {
                if (!item[type]) return res.status(500).json({ message: "invalid type" })
                if (item[type].length === 0) return res.status(200).json([])
                const items = []
                for (const subItemId of item[type]) {
                    const subItem = await mongoose.model(type).findById(subItemId)
                    // console.log("subItem", subItem);
                    items.push(await subItem.save())
                }
                response = items
            } else {
                const types = ['recruiters', "jobs", 'companies', "appliers", "appointments"]
                for (const collection of types) {
                    if (!item[collection] || item[collection].length === 0) continue
                    const items = []
                    for (const subItemId of item[collection]) {
                        const subItem = await mongoose.model(collection).findById(subItemId)
                        // console.log("subItem", subItem);
                        items.push(await subItem.save())
                    }
                    response[collection] = items
                }
            }

            res.json(response)
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    remove: async (req, res) => {
        try {
            const { collection, id, type, subItemId } = req.params

            // get item
            const item = await mongoose.model(collection).findById(id);
            if (item === null) return res.status(404).json({ message: 'item not found' });
            // console.log(item);

            // get subItem
            const subItem = await mongoose.model(type).findById(subItemId)
            console.log(subItem);
            console.log(subItem[collection]);

            // update subItem
            if (subItem[collection])
                subItem[collection].pull(id)
            await subItem.save()

            // add event
            const event = await new mongoose.model('events')({
                name: `${type} has been removed`,
                user: req.user._id,
                [collection]: [id]
            })
            await event.save()

            // update item
            item[type].pull(subItemId)
            item.events.push(event._id)
            await item.save()

            res.status(200).json({ [collection]: item, message: `${subItem.name} has been removed from ${item.name}` })
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const { collection, id, type, subItemId } = req.params

            // get item
            const item = await mongoose.model(collection).findById(id);
            if (item === null) return res.status(404).json({ message: 'not found' })

            // get subItem
            await mongoose.model(type).findByIdAndDelete(subItemId)

            // add event
            const event = await new mongoose.model('events')({
                name: `${type} has been deleted`,
                user: req.user._id,
                [collection]: [item._id]
            })
            await event.save()

            // update item
            item[type].pull(subItemId)
            item.events.push(event._id)
            await item.save()

            res.status(200).json({ [collection]: item, message: `${type} has been deleted` })
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
}