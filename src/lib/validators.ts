import { z } from "zod";
import { cnpjValido, limparCnpj } from "./cnpj";

export const AREAS = ["Educação", "Assistência social", "Meio ambiente", "Saúde", "Cultura"] as const;
export const VERIFICACOES = ["demonstrativo", "nao_verificado", "verificado"] as const;

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);
const vazioVira = (v: unknown, novo: null | undefined) => (typeof v === "string" && v.trim() === "" ? novo : v);

/** Campo opcional: "" vira ausente (cadastro). */
const opcional = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => vazioVira(v, undefined), s.optional());
/** Campo opcional que pode ser limpo: "" vira null (edição). */
const limpavel = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => vazioVira(v, null), s.nullable().optional());

const site = z
  .string()
  .trim()
  .max(200)
  .regex(/^(https?:\/\/[^\s]+|@[A-Za-z0-9_.]{2,50})$/, "Use um link (https://...) ou um @perfil");
const cnpj = z.string().refine(cnpjValido, "CNPJ inválido").transform(limparCnpj);
const email = z.string().trim().toLowerCase().email().max(254);
const senha = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(72)
  .regex(/[A-Za-z]/, "A senha precisa ter uma letra")
  .regex(/\d/, "A senha precisa ter um número");

// Tela "Cadastrar ONG" (pública, sem login)
export const cadastroOngSchema = z
  .object({
    nome: texto(3, 120),
    cnpj: opcional(cnpj),
    descricao: texto(20, 1000),
    area: z.enum(AREAS),
    bairro: texto(2, 80),
    endereco: opcional(texto(3, 200)),
    responsavel: texto(3, 120),
    contato: texto(5, 120),
    site: opcional(site),
    referencias: texto(10, 1000),
  })
  .strict();

// Tela "Área da ONG > Cadastre-se"
export const registrarSchema = z
  .object({
    nome: texto(3, 120),
    email,
    telefone: z
      .string()
      .trim()
      .refine((t) => /^\d{10,11}$/.test(t.replace(/\D/g, "")), "Telefone inválido")
      .transform((t) => t.replace(/\D/g, "")),
    senha,
    confirmarSenha: z.string(),
  })
  .strict()
  .refine((d) => d.senha === d.confirmarSenha, { message: "As senhas não conferem", path: ["confirmarSenha"] });

export const loginSchema = z.object({ email, senha: z.string().min(1).max(72) }).strict();
export const recuperarSenhaSchema = z.object({ email }).strict();
export const redefinirSenhaSchema = z.object({ senha }).strict();

// Painel: o gestor edita estes campos (status, CNPJ, verificação e posição são da equipe)
export const painelSchema = z
  .object({
    nome: texto(3, 120),
    bairro: texto(2, 80),
    area: z.enum(AREAS),
    descricao: texto(20, 1000),
    endereco: limpavel(texto(3, 200)),
    contato: texto(5, 120),
    site: limpavel(site),
  })
  .strict();

export const projetoSchema = z.object({ nome: texto(2, 100), descricao: limpavel(texto(1, 500)) }).strict();

export const filtroOngsSchema = z.object({
  q: z.string().trim().max(60).optional(),
  area: z.enum(AREAS).optional(),
  pagina: z.coerce.number().int().min(1).max(1000).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(50),
});

export const moderacaoSchema = z.discriminatedUnion("acao", [
  z
    .object({
      acao: z.literal("aprovar"),
      lat: z.number().min(-4.1).max(-3.6),
      lon: z.number().min(-38.8).max(-38.3),
      verificacao: z.enum(VERIFICACOES).default("nao_verificado"),
    })
    .strict(),
  z.object({ acao: z.literal("rejeitar"), motivo: texto(5, 500) }).strict(),
]);

export const gestorSchema = z.object({ email }).strict();
export const idSchema = z.coerce.number().int().positive().max(2_147_483_647);
export const confirmarExclusaoSchema = z.object({ confirmar: z.literal(true) }).strict();
