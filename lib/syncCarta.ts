import { prisma } from "./prisma";
import fs from "fs";
import path from "path";

export async function syncCartaToWeb() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { id: "asc" }],
    });

    const webMenuPath = path.resolve("C:/Users/UnderDesignAI/Desktop/Webs/Obentojapanesefood.es/src/data/menuData.js");
    if (!fs.existsSync(webMenuPath)) {
      console.warn("⚠️ No se encontró menuData.js en la web principal");
      return { ok: false, error: "Archivo menuData.js no encontrado" };
    }

    const currentContent = fs.readFileSync(webMenuPath, "utf8");

    // Convert items into clean JS code format
    const menuEntries = items.map(item => {
      const alergenosArray = item.alergenos
        ? item.alergenos.split(",").map(a => a.trim()).filter(Boolean)
        : [];
      
      const props: string[] = [
        `id: '${item.id}'`,
        `cat: '${item.categoria}'`,
      ];

      if (item.sub) {
        props.push(`sub: '${item.sub}'`);
      }

      props.push(`nombre: ${JSON.stringify(item.nombre)}`);
      props.push(`descripcion: ${JSON.stringify(item.descripcion || "")}`);
      props.push(`precio: ${Number(item.precio).toFixed(2)}`);

      if (item.imagen) {
        props.push(`imagen: ${JSON.stringify(item.imagen)}`);
      }

      props.push(`alergenos: ${JSON.stringify(alergenosArray)}`);

      if (item.destacado) {
        props.push(`destacado: true`);
      }

      return `  { ${props.join(", ")} }`;
    });

    const newMenuCode = `export const MENU = [\n${menuEntries.join(",\n")}\n];`;

    // Reemplazar la sección export const MENU = [ ... ];
    const regex = /export const MENU = \[[\s\S]*?\n\];/;
    if (!regex.test(currentContent)) {
      console.warn("⚠️ Regex no coincidió con export const MENU en menuData.js");
      return { ok: false, error: "Formato no reconocido en menuData.js" };
    }

    const updatedContent = currentContent.replace(regex, newMenuCode);
    fs.writeFileSync(webMenuPath, updatedContent, "utf8");

    // También sincronizar con configuracion menus_cartas del dashboard
    const subLabels: Record<string, string> = {
      nigiri: "Nigiri",
      uramaki: "Uramaki",
      futomaki: "Futomaki",
      maki: "Maki",
    };

    const configuracionMenus = {
      entrantes: [
        {
          title: "Entrantes",
          items: items.filter(x => x.categoria === "entrantes").map(x => ({
            name: x.nombre,
            desc: x.descripcion || "",
            price: `${Number(x.precio).toFixed(2)} €`,
            allergens: x.alergenos || "",
            image: x.imagen || "",
            activo: true,
          })),
        },
      ],
      sushi: ["nigiri", "uramaki", "futomaki", "maki"].map(sub => ({
        title: subLabels[sub] || sub,
        items: items.filter(x => x.categoria === "sushi" && x.sub === sub).map(x => ({
          name: x.nombre,
          desc: x.descripcion || "",
          price: `${Number(x.precio).toFixed(2)} €`,
          allergens: x.alergenos || "",
          image: x.imagen || "",
          activo: true,
        })),
      })),
      calientes: [
        {
          title: "Platos Calientes & Wok",
          items: items.filter(x => x.categoria === "calientes").map(x => ({
            name: x.nombre,
            desc: x.descripcion || "",
            price: `${Number(x.precio).toFixed(2)} €`,
            allergens: x.alergenos || "",
            image: x.imagen || "",
            activo: true,
          })),
        },
      ],
      postres: [
        {
          title: "Postres Japoneses",
          items: items.filter(x => x.categoria === "postres").map(x => ({
            name: x.nombre,
            desc: x.descripcion || "",
            price: `${Number(x.precio).toFixed(2)} €`,
            allergens: x.alergenos || "",
            image: x.imagen || "",
            activo: true,
          })),
        },
      ],
      bebidas: [
        {
          title: "Bebidas & Cervezas",
          items: items.filter(x => x.categoria === "bebidas").map(x => ({
            name: x.nombre,
            desc: x.descripcion || "",
            price: `${Number(x.precio).toFixed(2)} €`,
            allergens: x.alergenos || "",
            image: x.imagen || "",
            activo: true,
          })),
        },
      ],
    };

    await prisma.configuracion.upsert({
      where: { clave: "menus_cartas" },
      update: { valor: JSON.stringify(configuracionMenus) },
      create: { clave: "menus_cartas", valor: JSON.stringify(configuracionMenus) },
    });

    console.log(`✅ [syncCartaToWeb] Sincronizados ${items.length} platos con la web pública y la carta de pedidos.`);
    return { ok: true, count: items.length };
  } catch (err: any) {
    console.error("❌ Error en syncCartaToWeb:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}
