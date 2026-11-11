package br.com.ebdgestao.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "chamada",
        uniqueConstraints = @UniqueConstraint(name = "uk_chamada_aula_membro", columnNames = {"aula_id", "membro_id"}))
@Getter
@Setter
public class Chamada {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aula_id", nullable = false)
    private Aula aula;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membro_id", nullable = false)
    private Membro membro;

    @Column(nullable = false)
    private Boolean presente = Boolean.FALSE;

    @Column(name = "trouxe_biblia", nullable = false)
    private Boolean trouxeBiblia = Boolean.FALSE;

    @Column(name = "trouxe_revista", nullable = false)
    private Boolean trouxeRevista = Boolean.FALSE;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = OffsetDateTime.now();
    }
}
