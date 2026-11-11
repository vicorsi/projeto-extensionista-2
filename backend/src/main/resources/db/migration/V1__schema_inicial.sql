CREATE TABLE usuarios (
    id          UUID PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(180) NOT NULL,
    senha_hash  VARCHAR(100) NOT NULL,
    papel       VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_usuarios_email UNIQUE (email)
);

CREATE TABLE classes_ebd (
    id                    UUID PRIMARY KEY,
    nome                  VARCHAR(100) NOT NULL,
    faixa_etaria          VARCHAR(60),
    descricao             VARCHAR(500),
    professor_titular_id  UUID,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_classes_professor FOREIGN KEY (professor_titular_id)
        REFERENCES usuarios (id) ON DELETE SET NULL
);

CREATE TABLE membros (
    id           UUID PRIMARY KEY,
    nome         VARCHAR(150) NOT NULL,
    classe_id    UUID NOT NULL,
    tipo_membro  VARCHAR(20) NOT NULL,
    telefone     VARCHAR(30),
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_membros_classe FOREIGN KEY (classe_id)
        REFERENCES classes_ebd (id) ON DELETE CASCADE
);
CREATE INDEX idx_membros_classe ON membros (classe_id);

CREATE TABLE aulas (
    id               UUID PRIMARY KEY,
    classe_id        UUID NOT NULL,
    data_aula        DATE NOT NULL,
    numero_licao     INTEGER,
    tema_licao       VARCHAR(200),
    leitura_biblica  VARCHAR(200),
    valor_oferta     NUMERIC(10, 2),
    status           VARCHAR(20) NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_aulas_classe_data UNIQUE (classe_id, data_aula),
    CONSTRAINT fk_aulas_classe FOREIGN KEY (classe_id)
        REFERENCES classes_ebd (id) ON DELETE CASCADE
);
CREATE INDEX idx_aulas_data ON aulas (data_aula);

CREATE TABLE chamada (
    id              UUID PRIMARY KEY,
    aula_id         UUID NOT NULL,
    membro_id       UUID NOT NULL,
    presente        BOOLEAN NOT NULL DEFAULT FALSE,
    trouxe_biblia   BOOLEAN NOT NULL DEFAULT FALSE,
    trouxe_revista  BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_chamada_aula_membro UNIQUE (aula_id, membro_id),
    CONSTRAINT fk_chamada_aula FOREIGN KEY (aula_id)
        REFERENCES aulas (id) ON DELETE CASCADE,
    CONSTRAINT fk_chamada_membro FOREIGN KEY (membro_id)
        REFERENCES membros (id) ON DELETE CASCADE
);

CREATE TABLE escala_professores (
    id            UUID PRIMARY KEY,
    classe_id     UUID NOT NULL,
    professor_id  UUID NOT NULL,
    data_domingo  DATE NOT NULL,
    papel_escala  VARCHAR(20) NOT NULL,
    observacao    VARCHAR(300),
    CONSTRAINT uk_escala_classe_data UNIQUE (classe_id, data_domingo),
    CONSTRAINT fk_escala_classe FOREIGN KEY (classe_id)
        REFERENCES classes_ebd (id) ON DELETE CASCADE,
    CONSTRAINT fk_escala_professor FOREIGN KEY (professor_id)
        REFERENCES usuarios (id) ON DELETE CASCADE
);
CREATE INDEX idx_escala_data ON escala_professores (data_domingo);

CREATE TABLE planos_licoes (
    id             UUID PRIMARY KEY,
    classe_id      UUID NOT NULL,
    numero_licao   INTEGER,
    titulo         VARCHAR(200) NOT NULL,
    texto_biblico  VARCHAR(200),
    data_sugerida  DATE,
    CONSTRAINT fk_planos_classe FOREIGN KEY (classe_id)
        REFERENCES classes_ebd (id) ON DELETE CASCADE
);
CREATE INDEX idx_planos_classe ON planos_licoes (classe_id);
