package com.cipher.repository;

import com.cipher.model.Message;
import com.cipher.model.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByTypeOrderByTimestampAsc(MessageType type);

    List<Message> findByTypeAndSenderIdAndReceiverIdOrTypeAndSenderIdAndReceiverIdOrderByTimestampAsc(
            MessageType t1,
            Long sender1,
            Long receiver1,
            MessageType t2,
            Long sender2,
            Long receiver2
    );
}
