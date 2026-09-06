import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { IngestController } from '../controllers/IngestController.js';

import { TranslateController } from '../controllers/TranslateController.js';
import { createClient } from '@supabase/supabase-js';

export function createTransactionsRouter(
    controller: IngestController, 
    translateController: TranslateController,
    apiToken: string,
    supabaseUrl: string,
    supabaseAnonKey: string
) {
    const router = new Hono();
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    router.post('/ingest', async (c, next) => {
        const auth = c.req.header('Authorization');
        if (auth !== `Bearer ${apiToken}`) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        await next();
    }, zValidator('json', z.object({
        source: z.string(),
        raw_body: z.string(),
        timestamp: z.string().optional(),
        user_id: z.string().uuid(),
        device_location: z.object({
            lat: z.number(),
            lng: z.number()
        }).optional()
    })), (c) => controller.handleIngest(c));
    
    router.post('/translate', zValidator('json', z.object({
        transaction_id: z.string().uuid(),
        address: z.string()
    })), async (c) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
        
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        
        const body = await c.req.json();
        return translateController.handleTranslate(c, data.user.id, body.transaction_id, body.address);
    });
    router.post('/import', async (c) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
        
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        
        return controller.handleUserImport(c, data.user.id);
    });

    router.post('/manual', async (c) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
        
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        
        return controller.handleManualEntry(c, data.user.id);
    });

    router.put('/:id', async (c) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
        
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        
        const transactionId = c.req.param('id');
        return controller.handleUpdate(c, data.user.id, transactionId);
    });

    return router;
}
