package br.com.ebdgestao.domain;

/**
 * Agrupa os enums do domínio. Cada enum é público e pode ser importado como
 * {@code br.com.ebdgestao.domain.Enums.Papel}, etc.
 */
public final class Enums {

    private Enums() {
    }

    public enum Papel { SUPERINTENDENTE, PROFESSOR, ALUNO }

    public enum TipoMembro { MEMBRO, VISITANTE }

    public enum StatusAula { ABERTA, CONCLUIDA }

    public enum PapelEscala { TITULAR, SUBSTITUTO, AUXILIAR }
}
