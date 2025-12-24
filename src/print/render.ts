import Mustache from 'mustache';
import fs from 'fs';
import path from 'path';

export function renderTemplate(
    templateType: string,
    templateName: string,
    data: Record<string, any>
): string {
    const templatePath = path.join(
        __dirname,
        'templates',
        templateType,
        `${templateName}.mustache` // Using .mustache extension for clarity
    );

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateType}/${templateName}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    return Mustache.render(templateContent, data);
}
