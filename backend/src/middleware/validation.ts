import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    phone: Joi.string().optional(),
    role: Joi.string().valid('PASSENGER', 'DRIVER').optional(),
    organizationId: Joi.string().optional(),
    context: Joi.string().valid('driver-app', 'passenger-app').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    role: Joi.string().valid('PASSENGER', 'DRIVER').optional(),
    context: Joi.string().valid('driver-app', 'passenger-app').optional()
  }),

  createAdmin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    phone: Joi.string().optional()
  }),

  createOrganization: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    licenseNumber: Joi.string().optional()
  }),

  createDriver: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    phone: Joi.string().optional()
  }),

  createVehicle: Joi.object({
    plateNumber: Joi.string().required(),
    model: Joi.string().required(),
    capacity: Joi.number().integer().min(1).required(),
    type: Joi.string().valid('BUS', 'MINIBUS', 'VAN').optional()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  })
};