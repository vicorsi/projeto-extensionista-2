package br.com.ebdgestao.service;

final class Texto {

    private Texto() {
    }

    /** Remove espaços e converte string vazia em null. */
    static String limpar(String valor) {
        if (valor == null) {
            return null;
        }
        String t = valor.trim();
        return t.isEmpty() ? null : t;
    }
}
