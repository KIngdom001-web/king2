import Joi from 'joi';

export const validateMessage = (message: any) => {
  const schema = Joi.object({
    chatId: Joi.string().required(),
    content: Joi.string().required(),
    receiverId: Joi.string().required()
  });

  return schema.validate(message);
};

export const validateChat = (chat: any) => {
  const schema = Joi.object({
    participants: Joi.array().items(Joi.string()).min(2).required(),
    type: Joi.string().valid('individual', 'group').required(),
    groupName: Joi.when('type', {
      is: 'group',
      then: Joi.string().required(),
      otherwise: Joi.forbidden()
    })
  });

  return schema.validate(chat);
};

