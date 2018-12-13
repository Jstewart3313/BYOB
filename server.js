const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const environment = process.env.NODE_ENV || 'development';
const cors = require('cors');
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.locals.title = 'BYOB';

app.use('/', express.static('frontend'))
app.use(bodyParser.json());
app.use(cors());

app.set('port', process.env.PORT || 3000);

app.get('/api/v1/makers', (request, response) => {
  const { maker } = request.query;

  if (maker) {
    database('makers')
      .where('maker', maker)
      .select()
      .then(makers => response.status(200).json(makers))
      .catch(error => response.status(500).json({ error }));
  } else {
    database('makers')
      .select()
      .then(carMakers => {
        response.status(200).json(carMakers);
      })
      .catch(error => {
        response.status(500).json({ error: error.message });
      });
  }
});

app.get('/api/v1/makers/:id', (request, response) => {
  database('makers')
    .where('id', request.params.id)
    .select()
    .then(carMakers => {
      if (carMakers.length) {
        response.status(200).json(carMakers);
      } else {
        response.status(404).json({
          error: `Could not find Maker with id ${request.params.id}`,
        });
      }
    });
});

app.post('/api/v1/makers', (request, response) => {
  const maker = request.body;

  for (const requiredParameter of ['maker', 'year']) {
    if (!maker[requiredParameter]) {
      return response.status(422).send({ error: 'There was no Maker to add!' });
    }
  }
  database('makers')
    .insert(maker, 'id')
    .then(newMaker => {
      response.status(201).json({ id: newMaker[0] });
    })
    .catch(error => {
      response.status(500).json({ error: error.message });
    });
});

app.delete('/api/v1/makers/:maker_id', (request, response) => {
  const { maker_id } = request.params;
  database('models')
    .where('maker_id', maker_id)
    .delete()
    .then(() =>
      database('makers')
        .where('id', maker_id)
        .delete(),
    )
    .then(makerId =>
      response.status(200).json({
        makerId,
        message: `Maker ${maker_id} has been deleted.`,
      }),
    )
    .catch(error =>
      response.status(500).json({
        error: `Error deleting maker: ${error.message}`,
      }),
    );
});
app.put('/api/v1/makers/:maker_id', async (request, response) => {
  const newMaker = request.body.maker;
  const { maker_id } = request.params;
  const maker = await database('makers')
    .where('id', maker_id)
    .select();
  let oldMaker;

  if (maker.length) {
    oldMaker = maker[0].maker;
  }

  database('makers')
    .where('maker', oldMaker)
    .update('maker', newMaker)
    .then(() =>
      response.status(202).json({
        message: `Edit successful. Maker with id of ${maker_id} name has been changed from ${oldMaker} to ${newMaker}.`,
      }),
    )
    .catch(() => {
      if (!maker.length) {
        return response
          .status(404)
          .json({ error: `Maker with id of ${maker_id} was not found.` });
      } else if (!newMaker) {
        return response.status(422).json({ error: 'No maker name provided' });
      }
    });
});

// ------Model End Points------ //

app.get('/api/v1/models', (request, response) => {
  const { engine, price, drivetrain } = request.query;


  if (price) {
    database('models')
      .where('price', price)
      .select()
      .then(models => {
        return response.status(200).json(models);
      })
      .catch(error => {
        return response.status(500).json({ error });
      });

  } else if (drivetrain) {
    database('models')
      .where('drivetrain', drivetrain)
      .select()
      .then(models => {
        return response.status(200).json(models);
      })
      .catch(error => {
        return response.status(500).json({ error });
      });
  } else if (engine) {
    database('models')
      .where('engine', engine)
      .select()
      .then(models => {
        return response.status(200).json(models);
      })
      .catch(error => {
        return response.status(500).json({ error });
      });

  } else {
    database('models')
      .select()
      .then(carModels => {
        response.status(200).json(carModels);
      })
      .catch(error => {
        response.status(500).json({ error });
      });
  }
});

app.get('/api/v1/models/:id', (request, response) => {
  database('models')
    .where('id', request.params.id)
    .select()
    .then(carModels => {
      if (carModels.length) {
        response.status(200).json(carModels);
      } else {
        response.status(404).json({
          error: `Could not find project with id ${request.params.id}`,
        });
      }
    })
    .catch(error => {
      response.status(500).json({ error });
    });
});

app.delete('/api/v1/makers/:maker_id/models/:model_id', (request, response) => {
  const { model_id, maker_id } = request.params;
  database('models')
    .where({
      id: model_id,
      maker_id,
    })
    .delete()
    .then(() =>
      response.status(200).json({
        message: `model ${model_id} for maker ${maker_id} has been deleted.`,
      }),
    )
    .catch(error =>
      response.status(500).json({
        error: `Error deleting model: ${error.message}`,
      }),
    );
});

app.post('/api/v1/makers/:id/models', (request, response) => {
  const model = request.body;

  for (const requiredParameters of [
    'model',
    'displacement',
    'engine',
    'drivetrain',
    'horsepower',
    'torque',
    'price',
  ]) {
    if (!model[requiredParameters]) {
      return response.status(422).send({ error: 'There was no Model to add!' });
    }
  }
  database('models')
    .insert(
      {
        model: model.model,
        displacement: model.displacement,
        engine: model.engine,
        drivetrain: model.drivetrain,
        horsepower: model.horsepower,
        torque: model.torque,
        price: model.price,
        maker_id: request.params.id,
      },
      'id',
    )
    .where('id', request.params.id)
    .then(newModel => {
      response.status(201).json({ id: newModel[0] });
    })
    .catch(error => {
      response.status(500).json({ error });
    });
});

app.put(
  '/api/v1/makers/:maker_id/models/:model_id',
  async (request, response) => {
    const newModel = request.body.model;
    const { model_id, maker_id } = request.params;
    const model = await database('models')
      .where({
        id: model_id,
        maker_id,
      })
      .select();
    let oldModel;

    if (model.length) {
      oldModel = model[0].model;
    }

    database('models')
      .where('model', oldModel)
      .update('model', newModel)
      .then(model =>
        response.status(202).json({
          model,
          message: `Edit successful. Model with id of ${model_id} name changed from ${oldModel} to ${newModel}.`,
        }),
      )
      .catch(error => {
        if (!model.length) {
          return response
            .status(404)
            .json({ error: `Model with id of ${model_id} was not found.` });
        } else if (!newModel) {
          return response
            .status(422)
            .json({ error: 'No model name provided.' });
        } else {
          return error;
        }
      });
  },
);

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});

module.exports = app;
