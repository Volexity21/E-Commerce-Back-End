const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [{
        model: Category,
      },
      {
        model: Tag,
      }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(400).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{
        model: Category,
      },
      {
        model: Tag,
      }]
    });
    res.status(200).json(productData)
  } catch (err) {
    res.status(400).json(err);
  }
});

// create new product
router.post('/', async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  const productData = await Product.create(req.body)
  try {
    // if there's product tags, we need to create pairings to bulk create in the ProductTag model
    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: productData.product_id,
          tag_id,
        };
      });
      console.log(productTagIdArr);
      ProductTag.bulkCreate(productTagIdArr);
    }
    // if no product tags, just respond
    res.status(200).json(productData);
    // res.status(200).json(productTagIdArr);
  } catch (err) {
    res.status(400).json(err);
  };
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      product_id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const deletedProductData = await Product.destroy({
      where: {
        product_id: req.params.id,
      },
    });
    res.status(200).json(deletedProductData);
  } catch (err) {
    res.status(400).json(err);
  }
})


module.exports = router;
