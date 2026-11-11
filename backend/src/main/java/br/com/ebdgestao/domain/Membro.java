package br.com.ebdgestao.domain;

import br.com.ebdgestao.domain.Enums.TipoMembro;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "membros")
@Getter
@Setter
public class Membro {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classe_id", nullable = false)
    private ClasseEbd classe;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_membro", nullable = false, length = 20)
    private TipoMembro tipoMembro;

    @Column(length = 30)
    private String telefone;

    @Column(nullable = false)
    private Boolean ativo = Boolean.TRUE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (ativo == null) {
            ativo = Boolean.TRUE;
        }
    }
}
