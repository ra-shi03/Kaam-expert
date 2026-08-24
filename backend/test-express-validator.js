import { body, validationResult } from 'express-validator';

const req = {
  body: {
    val: 5
  }
};

const middleware = body('val').optional().isNumeric();

middleware(req, {}, () => {
  const result = validationResult(req);
  console.log("Validation Result:", result.array());
});
