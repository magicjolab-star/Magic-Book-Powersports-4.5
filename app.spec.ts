import { test, expect } from '@playwright/test';
test('splash finishes and dashboard is usable',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Tableau de bord',exact:true})).toBeVisible({timeout:16000});
 await expect(page.locator('.splash')).toHaveCount(0);
 await expect(page.locator('main img').first()).toHaveJSProperty('naturalWidth',1536);
 await expect(page.locator('.footer-brand')).toHaveAttribute('href','https://magic-app.ca');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('video failure cannot block dashboard',async({page})=>{
 await page.route('**/splash-video.mp4',route=>route.abort());
 await page.goto('/');await expect(page.locator('.splash')).toHaveCount(0,{timeout:16000});
 await expect(page.getByRole('button',{name:'Nouvelle évaluation',exact:true})).toBeEnabled();
});
test('reduced motion skips video',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('.splash')).toHaveCount(0,{timeout:5000});
});
test('create and restore a local dossier',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Nouvelle évaluation',exact:true}).click();
 await page.getByLabel('Année',{exact:true}).fill('2024');await page.getByLabel('Marque',{exact:true}).fill('Yamaha');await page.getByLabel('Modèle',{exact:true}).fill('Grizzly');
 await page.getByRole('button',{name:'Enregistrer le dossier',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.recent-item')).toContainText('Yamaha Grizzly');
 await page.reload();await expect(page.locator('.splash')).toHaveCount(0,{timeout:5000});await expect(page.locator('.recent-item')).toContainText('Yamaha Grizzly');
});
test('corrupt local store shows an explicit retry instead of fake readiness',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('magic-book:beta41:drafts:v1','broken'));
 await page.goto('/');await expect(page.getByRole('button',{name:'Réessayer',exact:true})).toBeVisible();
 await expect(page.locator('.app-shell')).toHaveAttribute('inert','');
});
