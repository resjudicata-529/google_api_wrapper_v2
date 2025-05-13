import { FastifyPluginAsync } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';

export const staticPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../public'),
    prefix: '/',
  });
}; 